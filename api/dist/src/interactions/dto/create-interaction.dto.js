"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineQueryDto = exports.SearchInteractionDto = exports.CreateInteractionDto = exports.DirectionType = exports.ChannelType = void 0;
const class_validator_1 = require("class-validator");
var ChannelType;
(function (ChannelType) {
    ChannelType["EMAIL"] = "EMAIL";
    ChannelType["WHATSAPP"] = "WHATSAPP";
    ChannelType["SMS"] = "SMS";
    ChannelType["CALL"] = "CALL";
    ChannelType["NOTE"] = "NOTE";
    ChannelType["MEETING"] = "MEETING";
})(ChannelType || (exports.ChannelType = ChannelType = {}));
var DirectionType;
(function (DirectionType) {
    DirectionType["INBOUND"] = "INBOUND";
    DirectionType["OUTBOUND"] = "OUTBOUND";
    DirectionType["INTERNAL"] = "INTERNAL";
})(DirectionType || (exports.DirectionType = DirectionType = {}));
class CreateInteractionDto {
    constructor() {
        this.direction = DirectionType.OUTBOUND;
        this.isPrivate = false;
    }
}
exports.CreateInteractionDto = CreateInteractionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ChannelType),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DirectionType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "direction", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "fromAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "toAddress", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateInteractionDto.prototype, "ccAddresses", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateInteractionDto.prototype, "bccAddresses", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "externalId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "threadId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateInteractionDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInteractionDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateInteractionDto.prototype, "isPrivate", void 0);
class SearchInteractionDto {
}
exports.SearchInteractionDto = SearchInteractionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchInteractionDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchInteractionDto.prototype, "clientId", void 0);
class TimelineQueryDto {
    constructor() {
        this.limit = '50';
        this.offset = '0';
        this.includePrivate = 'false';
    }
}
exports.TimelineQueryDto = TimelineQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TimelineQueryDto.prototype, "includePrivate", void 0);
//# sourceMappingURL=create-interaction.dto.js.map